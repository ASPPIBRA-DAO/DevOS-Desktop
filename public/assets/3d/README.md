# Diretório de Assets 3D — DevOS Desktop

Este diretório armazena modelos 3D, texturas, mapas de ambiente e decodificadores utilizados pelo módulo de inicialização Three.js.

## Diretrizes para a v1.0.0
- **Formatos recomendados:**
  - Modelos: `.glb` (binário auto-contido com malhas, materiais e animações embutidos) ou `.gltf`.
  - Texturas: `.png`, `.webp`, `.jpg` (resolução máxima recomendada de 2048x2048).
- **Operação 100% Offline:**
  - Todos os assets colocados nesta pasta são servidos estaticamente a partir da raiz `/assets/3d/...` do bundle do Tauri/Vite.
  - Nenhum asset deve depender de CDNs ou servidores remotos.
- **Tamanho do Bundle:**
  - Mantenha o conjunto de modelos otimizado (idealmente < 15 MB) com compressão Draco ou Meshopt para garantir carregamento instantâneo.
