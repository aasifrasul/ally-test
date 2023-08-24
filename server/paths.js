import path from 'path';

export const pathRoot = process.cwd();
export const pathRootDir = pathRoot;
export const pathSource = path.join(pathRoot, 'src');
export const pathBuild = path.join(pathRoot, 'build');
export const pathPublic = path.join(pathRoot, 'public');
export const pathWebpack = path.join(pathRoot, 'webpack');
export const pathWebpackConfigs = path.join(pathRoot, 'webpack-configs');
export const pathTemplate = path.join(pathPublic, 'ally-test');
export const pathImage = path.join(pathRoot, 'assets', 'images');
export const pathBuildTime = path.join(pathPublic, 'server', 'buildtime');
export const pathTSConfig = path.join(pathRoot, 'tsconfig.json');
export const pathRecordsJSON = path.join(pathRoot, 'records.json');
