// noinspection HttpUrlsUsage
fetch(
  `http://${process.env['ELASTICSEARCH_HOSTNAME']}:9200/_index_template/my-template`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${process.env['ELASTICSEARCH_USERNAME']}:${process.env['ELASTICSEARCH_PASSWORD']}`)}`,
    },
    body: JSON.stringify({
      index_patterns: ['my-index-*'],
      template: {
        settings: {
          number_of_shards: 1,
        },
        mappings: {
          properties: {
            field1: { type: 'text' },
            field2: { type: 'keyword' },
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
