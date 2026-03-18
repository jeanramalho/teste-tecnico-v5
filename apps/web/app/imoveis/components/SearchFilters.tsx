// apps/web/app/imoveis/components/SearchFilters.tsx
// MÓDULO 3: Implementação do componente
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, ChangeEvent } from "react";

const BAIRROS = ["Jardins", "Itaim Bibi", "Vila Nova Conceição", "Moema", "Pinheiros", "Brooklin"];

export function SearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [error, setError] = useState("");

  const selectedNeighborhoods = searchParams.get("neighborhood")?.split(",") || [];

  const handleApplyFilters = (formData: FormData) => {
    const min = Number(formData.get("price_min"));
    const max = Number(formData.get("price_max"));
    if (min && max && min > max) {
      setError("Preço mínimo não pode ser maior que o máximo");
      return;
    }
    setError("");

    const params = new URLSearchParams();
    
    // Checkboxes (multi-select)
    const neighborhoods = formData.getAll("neighborhood") as string[];
    if (neighborhoods.length > 0) {
      params.set("neighborhood", neighborhoods.join(","));
    }

    const priceMin = formData.get("price_min") as string;
    const priceMax = formData.get("price_max") as string;
    const suitesMin = formData.get("suites_min") as string;
    const areaMin = formData.get("area_min") as string;

    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (suitesMin) params.set("suites_min", suitesMin);
    if (areaMin) params.set("area_min", areaMin);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleChange = (e: ChangeEvent<HTMLFormElement>) => {
    // Para funcionar "sem reload" cada mudança atualiza URL (exceto se houver erro)
    const formData = new FormData(e.currentTarget);
    const min = Number(formData.get("price_min"));
    const max = Number(formData.get("price_max"));
    if (min && max && min > max) {
      setError("Preço mínimo não pode ser maior que o máximo");
      return;
    }
    setError("");

    const params = new URLSearchParams();
    const neighborhoods = formData.getAll("neighborhood") as string[];
    if (neighborhoods.length > 0) {
      params.set("neighborhood", neighborhoods.join(","));
    }
    
    const priceMin = formData.get("price_min") as string;
    const priceMax = formData.get("price_max") as string;
    const suitesMin = formData.get("suites_min") as string;
    const areaMin = formData.get("area_min") as string;

    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (suitesMin) params.set("suites_min", suitesMin);
    if (areaMin) params.set("area_min", areaMin);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    setError("");
    router.push(pathname, { scroll: false });
  };

  return (
    <form 
      action="/imoveis" 
      method="get" 
      onChange={handleChange}
      onSubmit={(e) => { e.preventDefault(); handleApplyFilters(new FormData(e.currentTarget)); }}
      style={{ padding: 24, border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 24 }}
      data-testid="search-filters-form"
    >
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>Filtros</h3>
      {error && <p role="alert" style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>}
      
      {/* Bairros */}
      <div style={{ marginBottom: 16 }}>
        <strong>Bairros</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {BAIRROS.map((b) => (
            <label key={b}>
              <input 
                type="checkbox" 
                name="neighborhood" 
                value={b} 
                defaultChecked={selectedNeighborhoods.includes(b)} 
              />
              {" "}{b}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <label>
          <strong>Preço Mínimo</strong><br/>
          <input type="number" name="price_min" defaultValue={searchParams.get("price_min") ?? ""} />
        </label>
        <label>
          <strong>Preço Máximo</strong><br/>
          <input type="number" name="price_max" defaultValue={searchParams.get("price_max") ?? ""} />
        </label>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <label>
          <strong>Suítes (Mín)</strong><br/>
          <select name="suites_min" defaultValue={searchParams.get("suites_min") ?? ""}>
            <option value="">Qualquer</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </label>
        <label>
          <strong>Área Mínima (m²)</strong><br/>
          <input type="number" name="area_min" defaultValue={searchParams.get("area_min") ?? ""} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Aplicar Filtros
        </button>
        <button type="button" onClick={handleClear} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer" }}>
          Limpar Filtros
        </button>
      </div>
    </form>
  );
}
