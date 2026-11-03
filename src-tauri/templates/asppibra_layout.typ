// ====================================================================
// ASPPIBRA DAO - Biblioteca de Layout Canônico Unificado (Typst)
// Facade Canônica de Agregação e Retrocompatibilidade Institucional
// Padrão Institucional para Contratos e Documentos Oficiais
// ====================================================================
//
// Este arquivo atua como ponto único de agregação e compatibilidade
// para todos os templates canônicos da infraestrutura documental.
// Toda a lógica e definições foram modularizadas na pasta `core/`:
//
// - core/branding.typ      -> Razão social, CNPJ, sigla, logo SVG e paleta de cores
// - core/typography.typ    -> Famílias de fontes, escalas de texto e entrelinhas
// - core/page_abnt.typ     -> Geometria de página e perfis de margens institucionais
// - core/header_footer.typ -> Cabeçalho principal, corrente e rodapé com controle de integridade
// - core/data_tags.typ     -> Renderizador de tags e preenchimento dinâmico
// ====================================================================

#import "core/branding.typ": *
#import "core/typography.typ": *
#import "core/page_abnt.typ": *
#import "core/header_footer.typ": *
#import "core/data_tags.typ": *
