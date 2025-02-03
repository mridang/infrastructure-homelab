const { getJestProjectsAsync } = require('@nx/jest');

getJestProjectsAsync().then((dd) => {
  console.log('mood');
  console.log(dd);
});
module.exports = async () => ({
  projects: [...(await getJestProjectsAsync())],
});
