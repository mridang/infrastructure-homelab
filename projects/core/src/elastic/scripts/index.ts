/**
 * @file Upserts the Elasticsearch index templates and lifecycle policy, then rolls over the Beats indices.
 */

// The package is CommonJS, so the work runs in an async function rather than at the top level.
// eslint-disable-next-line unicorn/prefer-top-level-await, @typescript-eslint/no-floating-promises -- CommonJS package cannot use top-level await, and the pod runs this file as an ES module
(async () => {
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
    const credentials = `${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`;
    // noinspection HttpUrlsUsage
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- fetch is stable in the Node 22 image this script runs in
    return await fetch(
      `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(credentials)}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
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
    const data = (await response.json()) as { acknowledged: boolean };
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
    const data = (await response.json()) as { acknowledged: boolean };
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
    const data = (await response.json()) as { acknowledged: boolean };
    if (data.acknowledged) {
      console.log('Lifecycle policy "packetbeat" updated successfully');
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(error);
  }

  for (const beat of ['filebeat', 'packetbeat', 'metricbeat']) {
    try {
      const response = await elasticRequest(
        `/${beat}-${process.env['ELASTICSEARCH_VERSION']}/_rollover`,
        'POST',
      );
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} ${response.statusText}`,
        );
      }
      const data = (await response.json()) as RolloverResponse;
      if (!data.acknowledged || !data.rolled_over) {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
      }
      console.log(`Rolled over ${data.old_index} to ${data.new_index}`);
    } catch (error) {
      console.error(error);
    }
  }
})();
