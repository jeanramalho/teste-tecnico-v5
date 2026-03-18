// packages/shared/domain/SyncConflictResolver.ts

import type { Property } from "./Property";

export type ConflictStrategy = "LOCAL_WINS" | "SERVER_WINS" | "MERGED";

export interface ConflictResult {
  resolved: Property;
  strategy: ConflictStrategy;
  requiresReview: boolean;
  conflictingFields: string[];
}

export function getChangedFields(a: Property, b: Property): (keyof Property)[] {
  const changed: (keyof Property)[] = [];
  for (const key of Object.keys(a) as (keyof Property)[]) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      changed.push(key);
    }
  }
  return changed;
}

export function resolveConflict(
  local: Property,
  server: Property,
  base: Property
): ConflictResult {
  const localChanges = getChangedFields(base, local);
  const serverChanges = getChangedFields(base, server);
  const allChanges = Array.from(new Set([...localChanges, ...serverChanges]));
  const intersection = localChanges.filter(x => serverChanges.includes(x));

  if (allChanges.length === 1 && allChanges[0] === 'status') {
    return { resolved: { ...server }, strategy: "SERVER_WINS", requiresReview: false, conflictingFields: intersection };
  }

  const onlyNotesOrPhotos = allChanges.every(f => f === 'notes' || f === 'photos');
  if (allChanges.length > 0 && onlyNotesOrPhotos) {
    return { resolved: { ...local }, strategy: "LOCAL_WINS", requiresReview: false, conflictingFields: intersection };
  }

  if (intersection.includes('price')) {
    return { resolved: { ...server }, strategy: "SERVER_WINS", requiresReview: false, conflictingFields: intersection };
  }

  if (intersection.length === 0) {
    const resolved = { ...base };
    serverChanges.forEach(f => { (resolved as any)[f] = server[f]; });
    localChanges.forEach(f => { (resolved as any)[f] = local[f]; });
    return { resolved, strategy: "MERGED", requiresReview: false, conflictingFields: [] };
  }

  const resolved = { ...base };
  serverChanges.forEach(f => { (resolved as any)[f] = server[f]; });
  localChanges.forEach(f => { (resolved as any)[f] = local[f]; }); 
  
  if (intersection.includes('status')) resolved.status = server.status;
  
  return { resolved, strategy: "LOCAL_WINS", requiresReview: true, conflictingFields: intersection };
}
