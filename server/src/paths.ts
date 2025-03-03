import path from 'path';

export const pathRootDir = path.join(__dirname, '..', '..');

export const pathSource = path.join(pathRootDir, 'src');
export const pathAssets = path.join(pathRootDir, 'assets');
export const pathBuild = path.join(pathRootDir, 'build');
export const pathPublic = path.join(pathRootDir, 'public');
export const pathFileUpload = path.join(pathPublic, 'uploads');
export const pathServer = path.join(pathPublic, 'server');
export const pathTemplate = path.join(pathPublic, 'ally-test');
export const pathImage = path.join(pathAssets, 'images');
export const pathBuildTime = path.join(pathServer, 'buildtime');
export const pathTSConfig = path.join(pathRootDir, 'tsconfig.json');
export const pathRecordsJSON = path.join(pathRootDir, 'records.json');
