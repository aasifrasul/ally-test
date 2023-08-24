import path from 'path';
import fs from 'fs';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const platform = process.env.PLATFORM;

export default {
	appBuild: resolveApp('build'),
	appBuildDev: resolveApp('public'),
	appVendor: (rootDir) => resolveApp(path.join(rootDir, 'vendor.js')),
	appRouteConfig: resolveApp('routeConfig.js'),
	packages: resolveApp('packages'),
	langEn: (rootDir) => resolveApp(path.join(rootDir, 'languages', 'en.js')),
	langHi: (rootDir) => resolveApp(path.join(rootDir, 'languages', 'hi.js')),
	appIndexJs: (rootDir) => {
		const indextsx = resolveApp(path.join(rootDir, '..', 'src', 'index.js'));
		if (fs.existsSync(indextsx)) {
			return indextsx;
		}
	},
};
