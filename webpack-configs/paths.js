import path from 'path';
import fs from 'fs';
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const platform = process.env.PLATFORM;
const appBuild = resolveApp('build');
const appBuildDev = resolveApp('public');
const packages = resolveApp('packages');
const appVendor = (rootDir) => resolveApp(path.resolve(rootDir, 'vendor.js'));
const langEn = (rootDir) => resolveApp(path.resolve(rootDir, 'languages', 'en.js'));
const langHi = (rootDir) => resolveApp(path.resolve(rootDir, 'languages', 'hi.js'));
const appRouteConfig = resolveApp('routeConfig.js');
const appIndexJs = (rootDir) => {
	const indextsx = resolveApp(path.resolve(rootDir, '..', 'src', 'index.js'));
	if (fs.existsSync(indextsx)) {
		return indextsx;
	}
};

export { appBuild, appBuildDev, appVendor, appRouteConfig, packages, langEn, langHi, appIndexJs };
