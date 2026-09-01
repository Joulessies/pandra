const { withProjectBuildGradle } = require('@expo/config-plugins');

const withWorkRuntimeFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const resolutionStrategy = `
allprojects {
  configurations.all {
    resolutionStrategy {
      force 'androidx.work:work-runtime:2.8.1'
      force 'androidx.work:work-runtime-ktx:2.8.1'
    }
  }
}
`;
      if (!config.modResults.contents.includes('androidx.work:work-runtime:2.8.1')) {
        config.modResults.contents += resolutionStrategy;
      }
    }
    return config;
  });
};

module.exports = withWorkRuntimeFix;
