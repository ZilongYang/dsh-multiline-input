/**
 * Host half of dsh-ml-input.
 *
 * The feature is browser-only. This row exists so the package is a real
 * bundle row that the Plugins page can install, enable and disable; the
 * browser half is discovered through package.json's `dsh.client`
 * declaration and served by client-modules.
 *
 * Reference contracts (source checkout `deepseek-harness`, 0.2.1-rc.3):
 *   - packages/client/modules/README.zh.md
 *   - packages/util/package-manifest/src/types.ts (DshClientManifest)
 *   - packages/boot/plugin-manager/src/index.ts ("not-bundle")
 */
export const name = 'ml-input'

/** The Host half owns no services; it only keeps the bundle row alive. */
export function apply() {}
