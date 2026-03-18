# Decisões Técnicas

> Preencha cada seção respeitando o limite de linhas. Respostas genéricas serão penalizadas.
> Queremos opinião, não hedge.

## 1. Boundary Server/Client (máx 3 linhas)

A boundary foi definida elevando o fetch de dados para Server Components (otimizando SEO, Performance e reduzindo o peso do JS), enquanto interações de estado local (galeria, favoritos e calculadora) foram mantidas em Client Components separados.
## 2. Próximos passos de performance RN (máx 5 linhas)
**Análise**: `PropertyListItem` usa `React.memo`/`useCallback` para barrar re-renders de dependências estáveis. `propertyStore` faz cache manual no selector para estabilizar a matriz devolvida. `AnimatedHeader` usa *Reanimated* para enviar animações nativamente para a UI Thread. Sem memo e cache no store, o teste contabilizaria atualizações repetidas e re-renders em todos os **5** filhos simultaneamente, esgotando recursos toda vez que a store fosse mudada.
**10k Itens**: Usaria `FlashList` (Shopify) para reciclagem massiva de View. Trocaria imagens padrões por `expo-image` e limitaria carga de vídeos ativados só em "viewableItems" no intersect. Faria o fetch iterativo (Lazy pagination).

## 3. Trade-off do Sync (máx 5 linhas)

<!-- A resolução de conflito que implementei tem uma fraqueza: [descreva]. Se tivesse mais tempo, eu: [descreva]. -->

## 4. O bug mais difícil (máx 3 linhas)

<!-- O bug que mais demorei para encontrar foi: [qual]. Porque: [por que foi difícil]. -->

## 5. O que eu NÃO mexeria em produção (máx 3 linhas)

<!-- Se este fosse um app real, o arquivo que eu NÃO refatoraria agora é: [qual]. Porque: [justifique — custo vs benefício]. -->
