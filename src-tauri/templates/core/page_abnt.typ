// ====================================================================
// ASPPIBRA DAO - Geometria de Página e Perfis Institucionais de Margens
// Módulo: core/page_abnt.typ
// ====================================================================

// Tamanho de Papel Padrão
#let standard_paper = "a4"

// Perfis Institucionais de Margens (Padrão A4)
// 1. Perfil Institucional Contratual A4 (Contratos Oficiais e Minutas Extensas)
#let margins_institutional_contract = (top: 2.5cm, bottom: 2.2cm, left: 3cm, right: 2cm)
#let margins_contract = margins_institutional_contract
#let margins_abnt_legal = margins_institutional_contract // Alias de compatibilidade retroativa

// 2. Perfil Institucional Financeiro A4 (Faturas, Recibos e Livro-Razão)
#let margins_institutional_financial = (top: 2.2cm, bottom: 2.2cm, left: 1.8cm, right: 1.8cm)
#let margins_financial = margins_institutional_financial

// 3. Perfil Institucional Territorial A4 (Relatórios Analíticos e Auditoria Cadastral)
#let margins_institutional_territorial = (top: 2.0cm, bottom: 2.0cm, left: 1.5cm, right: 1.5cm)
#let margins_territorial = margins_institutional_territorial
#let margins_report = margins_institutional_territorial // Alias de compatibilidade retroativa
