// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/_index_template/no-replication`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
    body: JSON.stringify({
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
    }),
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));

// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/_index_template/bump-max-fields`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
    body: JSON.stringify({
      index_patterns: ['.ds-metricbeat-*'],
      template: {
        settings: {
          'index.mapping.total_fields.limit': 110000,
        },
      },
    }),
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));

// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/_ilm/policy/packetbeat`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
    body: JSON.stringify({
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
    }),
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));

// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/filebeat-${process.env['ELASTICSEARCH_VERSION']}/_rollover`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));

// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/packetbeat-${process.env['ELASTICSEARCH_VERSION']}/_rollover`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));

// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/metricbeat-${process.env['ELASTICSEARCH_VERSION']}/_rollover`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
  },
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  })
  .then((data) => {
    if (data.acknowledged !== true) {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    console.log('Index template updated successfully:', data);
  })
  .catch((error) => console.error(error));
