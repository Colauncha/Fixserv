function readPackage(pkg) {
  if (pkg.dependencies) {
    pkg.dependencies["express"] = "^4.21.2";
  }
  if (pkg.devDependencies) {
    pkg.devDependencies["@types/express"] = "4.17.21";
    pkg.devDependencies["@types/express-serve-static-core"] = "4.19.8";
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
