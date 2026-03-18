// apps/web/app/imoveis/page.tsx
import { fetchProperties } from "../../lib/api";
import { PropertyList } from "./components/PropertyList";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ImoveisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const filters: any = {};
  if (params.neighborhood) filters.neighborhoods = String(params.neighborhood).split(",");
  if (params.price_min) filters.priceMin = Number(params.price_min);
  if (params.price_max) filters.priceMax = Number(params.price_max);
  if (params.suites_min) filters.suitesMin = Number(params.suites_min);
  if (params.area_min) filters.areaMin = Number(params.area_min);

  const properties = await fetchProperties(filters);

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Imóveis</h1>

      {/* TODO: SearchFilters vai aqui (Módulo 3) */}

      <PropertyList properties={properties} />
    </div>
  );
}
