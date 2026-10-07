import {copiedArtifactPaths} from './artifact-paths.js';

const websiteURL = new URL('../../../../../', import.meta.url);
const bytesCache = new Map();

// The accepted evaluators retain their immutable root-relative guard identities.
// This lexical fetch adapter serves those identities from exact Review copies.
export function reviewArtifactBytes(sourcePath) {
  if (!Object.hasOwn(copiedArtifactPaths, sourcePath)) throw Error('Unknown Female Review artifact: ' + sourcePath);
  if (!bytesCache.has(sourcePath)) {
    bytesCache.set(sourcePath, globalThis.fetch(new URL(copiedArtifactPaths[sourcePath], websiteURL))
      .then(async response => {
        if (!response.ok) throw Error('Female Review artifact unavailable: ' + sourcePath);
        return new Uint8Array(await response.arrayBuffer());
      }).catch(error=>{
        bytesCache.delete(sourcePath);
        throw error;
      }));
  }
  return bytesCache.get(sourcePath);
}

export function clearReviewArtifactCache() {
  bytesCache.clear();
}

export async function reviewArtifactFetch(input) {
  const sourcePath = String(input).replace(/^\//, '');
  const bytes = await reviewArtifactBytes(sourcePath);
  return new Response(bytes.slice(), {status:200});
}
