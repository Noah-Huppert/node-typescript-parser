import { join, resolve } from 'path';

import { DeclarationIndex } from '../../src/DeclarationIndex';
import { TypescriptParser } from '../../src/TypescriptParser';

describe('DeclarationIndex', () => {

    const rootPath = resolve(__dirname, '..', '_workspace', 'declaration-index');
    let declarationIndex: DeclarationIndex;

    beforeEach(() => {
        declarationIndex = new DeclarationIndex(new TypescriptParser(), rootPath);
    });

    it('should not process a circular export cycle', async () => {
        const files = [
            join(rootPath, 'circular-export', 'circularExport1.ts'),
            join(rootPath, 'circular-export', 'circularExport2.ts'),
        ];
        await declarationIndex.buildIndex(files);
    });

    it('should not have an index ready without build', () => {
        expect(declarationIndex.indexReady).toBe(false);
    });

    it('should have an index ready after build', async () => {
        expect(declarationIndex.indexReady).toBe(false);
        await declarationIndex.buildIndex([]);
        expect(declarationIndex.indexReady).toBe(true);
    });

    describe('buildIndex()', () => {

        const files = [
            join(rootPath, 'classes.ts'),
            join(rootPath, 'another-classes.ts'),
            join(rootPath, 'helper-functions.ts'),
            join(rootPath, 'myReactTemplate.tsx'),
            join(rootPath, 'prototype-funcs.ts'),
        ];

        beforeEach(async () => {
            await declarationIndex.buildIndex(files);
        });

        it('should contain certain parsedResources', () => {
            const idx: any = declarationIndex;
            const resources = Object.assign(Object.create(null), idx.parsedResources);

            expect(Object.keys(resources)).toMatchSnapshot();
        });

        it('should contain declarations with names', () => {
            const list = declarationIndex.index!['isString'];

            expect(list).toMatchSnapshot();
        });

        it('should contain a declaration name with multiple declarations', () => {
            const list = declarationIndex.index!['Class1'];

            expect(list).toMatchSnapshot();
        });

        it('should not crash on prototype methods (i.e. toString, hasOwnProperty)', () => {
            const list = declarationIndex.index!['toString'];
            expect(list).toMatchSnapshot();

            const list2 = declarationIndex.index!['hasOwnProperty'];
            expect(list).toMatchSnapshot();
        });

        it('should contain a declaration from a *.tsx file', () => {
            const idx: any = declarationIndex;
            const resources = Object.assign(Object.create(null), idx.parsedResources);
            const resource = resources['/myReactTemplate'];
            
            delete resource.filePath;
            delete resource.rootPath;
            
            expect(resource).toMatchSnapshot();
        });

    });

    describe('exports', () => {

        const folderRoot = join(rootPath, 'exports');

        it('should parse one single file correctly', async () => {
            await declarationIndex.buildIndex(
                [
                    join(folderRoot, 'classes.ts'),
                ],
            );

            expect(declarationIndex.index).toMatchSnapshot();
        });

        it('should export all elements correctly (export * from)', async () => {
            await declarationIndex.buildIndex(
                [
                    join(folderRoot, 'export-all.ts'),
                    join(folderRoot, 'classes.ts'),
                ],
            );

            expect(declarationIndex.index).toMatchSnapshot();
        });

        it('should export some elements correctly (export {} from)', async () => {
            await declarationIndex.buildIndex(
                [
                    join(folderRoot, 'export-some.ts'),
                    join(folderRoot, 'classes.ts'),
                ],
            );

            expect(declarationIndex.index).toMatchSnapshot();
        });

        it('should export some elements as alias correctly (export {x as y} from)', async () => {
            await declarationIndex.buildIndex(
                [
                    join(folderRoot, 'export-alias.ts'),
                    join(folderRoot, 'classes.ts'),
                ],
            );

            expect(declarationIndex.index).toMatchSnapshot();
        });
        
        it('should export elements that are already exported correclty', async () => {
            await declarationIndex.buildIndex(
                [
                    join(folderRoot, 'export-some.ts'),
                    join(folderRoot, 'classes.ts'),
                    join(folderRoot, 'export-from-export.ts'),
                ],
            );

            expect(declarationIndex.index).toMatchSnapshot();
        });

    });

});