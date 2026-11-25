import { Effect, FileSystem, Path } from 'effect';
import { decodeProof, EMPTY_PROOF, type Proof } from '../../src/lib/proof.ts';
import { readJson, RECORDS } from '../../src/lib/records.ts';

export const recordPath = (id: string): string => `${RECORDS}/${id}.json`;

export const readProof = (id: string) => Effect.flatMap(readJson(recordPath(id)), decodeProof);

export const readProofOrEmpty = (id: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    return (yield* fs.exists(recordPath(id))) ? yield* readProof(id) : EMPTY_PROOF;
  });

export const writeProof = (id: string, candidate: unknown) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const proof: Proof = yield* decodeProof(candidate);
    const file = recordPath(id);
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, `${JSON.stringify(proof, null, 2)}\n`);
    return proof;
  });
