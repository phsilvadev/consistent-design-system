import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductImageUpload } from "./image-upload";
import { uploadProductImage, type CatalogProduct } from "@/lib/auth/products";
vi.mock("@/lib/tenant/provider", () => ({
  useTenant: () => ({ tenant: { id: "11111111-1111-4111-8111-111111111111" } }),
}));
vi.mock("@/lib/auth/products", () => ({ uploadProductImage: vi.fn() }));
const product: CatalogProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  erp_id: "1",
  code: "MT30",
  name: "Metalon 30x30",
  description: "",
  category: "Metalon",
  active: true,
  has_variations: false,
  synced_at: 1,
  has_image: false,
  image_version: 0,
  image_updated_at: null,
};
beforeEach(() => {
  vi.stubGlobal(
    "URL",
    class extends URL {
      static override createObjectURL = vi.fn(() => "blob:preview-test");
      static override revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("Modal de imagem do produto", () => {
  it("permite arrastar uma imagem e só envia ao confirmar", async () => {
    const onUploaded = vi.fn();
    vi.mocked(uploadProductImage).mockResolvedValue({
      company_id: "11111111-1111-4111-8111-111111111111",
      product_id: product.id,
      has_image: true,
      image_version: 1,
      image_updated_at: 2,
    });
    render(
      <ProductImageUpload product={product} enabled onClose={vi.fn()} onUploaded={onUploaded} />,
    );
    const file = new File(["png"], "metalon.png", { type: "image/png" });
    fireEvent.drop(screen.getByRole("button", { name: "Área de upload de imagem" }), {
      dataTransfer: { files: [file] },
    });
    expect(uploadProductImage).not.toHaveBeenCalled();
    expect(await screen.findByAltText("Prévia de Metalon 30x30")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enviar imagem" }));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status")).toHaveTextContent("Imagem salva com sucesso");
  });
  it("rejeita arquivos grandes e formatos inválidos", () => {
    render(<ProductImageUpload product={product} enabled onClose={vi.fn()} onUploaded={vi.fn()} />);
    const input = screen.getByLabelText("Selecionar imagem do produto");
    fireEvent.change(input, {
      target: { files: [new File(["svg"], "foto.svg", { type: "image/svg+xml" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Formato não permitido");
    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" }),
        ],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("até 5 MB");
    expect(uploadProductImage).not.toHaveBeenCalled();
  });
  it("informa configuração pendente sem simular sucesso", () => {
    render(
      <ProductImageUpload
        product={product}
        enabled={false}
        onClose={vi.fn()}
        onUploaded={vi.fn()}
      />,
    );
    expect(screen.getByText(/precisa configurar o Firebase Storage/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar imagem" })).toBeDisabled();
  });
  it("mantém arquivo e permite tentar novamente após falha", async () => {
    vi.mocked(uploadProductImage).mockRejectedValue(new Error("Firebase indisponível"));
    render(<ProductImageUpload product={product} enabled onClose={vi.fn()} onUploaded={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Selecionar imagem do produto"), {
      target: { files: [new File(["png"], "foto.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar imagem" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Firebase indisponível");
    expect(screen.getByRole("button", { name: "Enviar imagem" })).not.toBeDisabled();
  });
});
