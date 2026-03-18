// apps/web/__tests__/search-filters.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchFilters } from "../app/imoveis/components/SearchFilters";

const pushMock = vi.fn();
const searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsMock,
  usePathname: () => "/imoveis",
}));

describe("SearchFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.delete("neighborhood");
    searchParamsMock.delete("price_min");
    searchParamsMock.delete("price_max");
    searchParamsMock.delete("suites_min");
    searchParamsMock.delete("area_min");
  });

  it("aplica filtro de bairro nos searchParams", () => {
    render(<SearchFilters />);
    const moemaCheckbox = screen.getByLabelText(/Moema/i);
    fireEvent.click(moemaCheckbox);

    // Deve atualizar a URL imediatamente via onChange do form
    expect(pushMock).toHaveBeenCalledWith("/imoveis?neighborhood=Moema", { scroll: false });
  });

  it("mostra erro quando preço mínimo > máximo", () => {
    render(<SearchFilters />);
    const minInput = screen.getByLabelText(/Preço Mínimo/i);
    const maxInput = screen.getByLabelText(/Preço Máximo/i);

    fireEvent.change(minInput, { target: { value: "5000" } });
    fireEvent.change(maxInput, { target: { value: "1000" } });

    expect(screen.getByRole("alert").textContent).toBe("Preço mínimo não pode ser maior que o máximo");
    
    // pushMock shouldn't have been called for this last invalid update
    expect(pushMock).toHaveBeenCalledTimes(1); // Foi chamado para o minInput disparado sem erro
  });

  it("limpar filtros reseta URL", () => {
    render(<SearchFilters />);
    const clearButton = screen.getByText(/Limpar Filtros/i);
    fireEvent.click(clearButton);

    // router.push("/imoveis") called
    expect(pushMock).toHaveBeenCalledWith("/imoveis", { scroll: false });
  });

  it("restaura filtros a partir da URL", () => {
    // Simulando que "Jardins" veio na URL
    searchParamsMock.set("neighborhood", "Jardins");
    searchParamsMock.set("price_min", "2000");

    render(<SearchFilters />);

    expect((screen.getByLabelText(/Jardins/i) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/Preço Mínimo/i) as HTMLInputElement).value).toBe("2000");
  });

  it("EDGE CASE: Ignora campos vazios para não poluir a URL gerada", () => {
    render(<SearchFilters />);
    const areaInput = screen.getByLabelText(/Área Mínima/i);

    // Preenche e depois apaga
    fireEvent.change(areaInput, { target: { value: "30" } });
    fireEvent.change(areaInput, { target: { value: "" } });

    // O último push não deve conter area_min na string de query
    const lastCallArg = pushMock.mock.calls[pushMock.mock.calls.length - 1][0];
    expect(lastCallArg).toBe("/imoveis?"); // sem parâmetros inúteis
  });
});
