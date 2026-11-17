/**
 * @file Upserts the Elasticsearch index templates and lifecycle policy, then rolls over the Beats indices.
 */

// The package is CommonJS, so the work runs in an async function rather than at the top level.
// eslint-disable-next-line unicorn/prefer-top-level-await -- the package is CommonJS, where tsc rejects top-level await
void (async () => {
  /**
   * Sends one authenticated request to the in-cluster Elasticsearch HTTP API.
   * @param path - The API path, beginning with a slash.
   * @param method - The HTTP method to use.
   * @param body - The optional JSON body to send.
   * @returns The raw HTTP response from Elasticsearch.
   * @example
   * const response = await elasticRequest('/_ilm/policy/packetbeat', 'PUT', { policy: {} });
   */
  async function elasticRequest(path: string, method: string, body?: unknown) {
    const credentials = `${process.env.ELASTICSEARCH_USERNAME}:${process.env.ELASTICSEARCH_PASSWORD}`;
    // noinspection HttpUrlsUsage
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- fetch is stable in the Node 22 image this script runs in
    return fetch(`http://${process.env.ELASTICSEARCH_HOSTNAME}:9200${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(credentials)}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  /**
   * Acknowledgement returned by Elasticsearch for an accepted request.
   */
  interface Acknowledgement {
    acknowledged: boolean;
  }

  /**
   * Rollover response returned by Elasticsearch for a data stream or alias.
   */
  interface RolloverResponse {
    acknowledged: boolean;
    rolled_over: boolean;
    old_index: string;
    new_index: string;
  }

  /**
   * Checks that the JSON body of an Elasticsearch response acknowledges the request.
   * @param data - The parsed JSON body.
   * @returns The body, once it is known to carry a boolean `acknowledged` field.
   * @example
   * const { acknowledged } = toAcknowledgement(await response.json());
   */
  function toAcknowledgement(data: unknown): Acknowledgement {
    const fields: Record<string, unknown> =
      typeof data === 'object' && data !== null
        ? Object.fromEntries(Object.entries(data))
        : {};
    if (typeof fields.acknowledged !== 'boolean') {
      throw new TypeError(`Unexpected response: ${JSON.stringify(data)}`);
    }
    return { acknowledged: fields.acknowledged };
  }

  /**
   * Checks that the JSON body of a rollover response carries the fields of a rollover result.
   * @param data - The parsed JSON body.
   * @returns The body, once its fields are known to have the types of a rollover result.
   * @example
   * const { old_index } = toRollover(await response.json());
   */
  function toRollover(data: unknown): RolloverResponse {
    const fields: Record<string, unknown> =
      typeof data === 'object' && data !== null
        ? Object.fromEntries(Object.entries(data))
        : {};
    if (
      typeof fields.acknowledged !== 'boolean' ||
      typeof fields.rolled_over !== 'boolean' ||
      typeof fields.old_index !== 'string' ||
      typeof fields.new_index !== 'string'
    ) {
      throw new TypeError(`Unexpected response: ${JSON.stringify(data)}`);
    }
    return {
      acknowledged: fields.acknowledged,
      rolled_over: fields.rolled_over,
      old_index: fields.old_index,
      new_index: fields.new_index,
    };
  }

  try {
    const response = await elasticRequest(
      '/_index_template/no-replication',
      'PUT',
      {
        index_patterns: ['*'],
        template: {
          settings: {
            number_of_replicas: 0,
          },
        },
        composed_of: [],
        priority: 999,
        data_stream: {
          hidden: false,
          allow_custom_routing: false,
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    const data = toAcknowledgement(await response.json());
    if (data.acknowledged) {
      console.log('Index template "no-replication" upserted successfully');
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const response = await elasticRequest(
      '/_index_template/bump-max-fields',
      'PUT',
      {
        index_patterns: ['.ds-metricbeat-*'],
        template: {
          settings: {
            'index.mapping.total_fields.limit': 110_000,
          },
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    const data = toAcknowledgement(await response.json());
    if (data.acknowledged) {
      console.log('Index template "bump-max-fields" upserted successfully');
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const response = await elasticRequest('/_ilm/policy/packetbeat', 'PUT', {
      policy: {
        phases: {
          hot: {
            actions: {
              rollover: {
                max_age: '2d', // Set max_age to 2 days
                max_primary_shard_size: '5gb', // Set max shard size to 5GB
              },
            },
          },
        },
      },
    });
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    const data = toAcknowledgement(await response.json());
    if (data.acknowledged) {
      console.log('Lifecycle policy "packetbeat" updated successfully');
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(error);
  }

  // eslint-disable-next-line functional/no-loop-statements -- the requests run one after another and each waits on the previous one
  for (const beat of ['filebeat', 'packetbeat', 'metricbeat']) {
    try {
      const response = await elasticRequest(
        `/${beat}-${process.env.ELASTICSEARCH_VERSION}/_rollover`,
        'POST',
      );
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} ${response.statusText}`,
        );
      }
      const data = toRollover(await response.json());
      if (!data.acknowledged || !data.rolled_over) {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
      }
      console.log(`Rolled over ${data.old_index} to ${data.new_index}`);
    } catch (error) {
      console.error(error);
    }
  }
})();
