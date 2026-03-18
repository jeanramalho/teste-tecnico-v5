// packages/shared/__tests__/conflict-resolver.test.ts

import { describe, it, expect } from "vitest";
import { resolveConflict } from "../domain/SyncConflictResolver";
import type { Property } from "../domain/Property";

function makeProperty(overrides?: Partial<Property>): Property {
  return {
    id: "prop-1",
    slug: "imovel",
    title: "Original Title",
    description: "Original Desc",
    neighborhood: "Jardins",
    price: 100000,
    area: 100,
    bedrooms: 2,
    suites: 1,
    parkingSpots: 1,
    status: "available",
    notes: ["Original note"],
    photos: ["photo1.jpg"],
    amenities: ["Pool"],
    updatedAt: 1000,
    updatedBy: "field_agent",
    ...overrides,
  };
}

describe("SyncConflictResolver", () => {
  it("Apenas status mudou -> SERVER_WINS", () => {
    const base = makeProperty();
    const local = makeProperty(); // Local did not change status
    const server = makeProperty({ status: "sold" });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("SERVER_WINS");
    expect(result.resolved.status).toBe("sold");
  });

  it("Apenas notes/photos mudaram -> LOCAL_WINS", () => {
    const base = makeProperty({ notes: ["Base"] });
    const server = makeProperty({ notes: ["Base"] }); // Server didn't change
    const local = makeProperty({ notes: ["Base", "Nova nota do corretor"] });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("LOCAL_WINS");
    expect(result.resolved.notes).toEqual(["Base", "Nova nota do corretor"]);
  });

  it("Price mudou nos dois lados -> SERVER_WINS", () => {
    const base = makeProperty({ price: 100 });
    const local = makeProperty({ price: 200 });
    const server = makeProperty({ price: 300 });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("SERVER_WINS");
    expect(result.resolved.price).toBe(300);
  });

  it("Campos diferentes mudaram em cada lado -> MERGED", () => {
    const base = makeProperty({ title: "Base Title", status: "available" });
    const local = makeProperty({ title: "New Title By Local", status: "available" });
    const server = makeProperty({ title: "Base Title", status: "sold" }); // Server mudou status, Local mudou title

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("MERGED");
    expect(result.resolved.title).toBe("New Title By Local"); // pegou do local
    expect(result.resolved.status).toBe("sold"); // pegou do server
  });

  it("Mesmo campo mudou nos dois -> LOCAL_WINS + requiresReview", () => {
    const base = makeProperty({ title: "Base Title" });
    const local = makeProperty({ title: "Corretor Title" });
    const server = makeProperty({ title: "Backoffice Title" });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("LOCAL_WINS");
    expect(result.requiresReview).toBe(true);
    expect(result.resolved.title).toBe("Corretor Title"); // Prevalece o local
  });
});
