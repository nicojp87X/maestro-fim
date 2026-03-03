export const EXTRACTION_PROMPT = `Analiza esta imagen/documento de resultados analíticos de laboratorio y extrae TODOS los biomarcadores presentes.

Para cada valor encontrado, devuelve un JSON con esta estructura exacta:

{
  "biomarkers": [
    {
      "biomarker_key": "identificador_snake_case",
      "biomarker_name": "Nombre completo en español",
      "raw_value": "valor tal como aparece en el documento",
      "numeric_value": 0.0,
      "unit": "unidad de medida",
      "reference_range_low": null o número,
      "reference_range_high": null o número,
      "lab_range_text": "rango del laboratorio como texto si aparece"
    }
  ],
  "lab_name": "nombre del laboratorio si aparece o null",
  "test_date": "fecha en formato YYYY-MM-DD si aparece o null",
  "patient_info": "cualquier info del paciente visible (sin datos identificativos)",
  "notes": "cualquier nota relevante del documento"
}

IMPORTANTE:
- Incluye TODOS los valores numéricos que veas
- Si un valor aparece como "< X" o "> X", registra el valor numérico en numeric_value
- Para unidades: estandariza (mg/dL, g/dL, mU/L, ng/mL, µg/dL, etc.)
- Si no puedes leer algún valor claramente, incluye el biomarker con raw_value = "ilegible"
- Para biomarker_key usa snake_case en inglés (glucose_fasting, tsh, crp_hs, etc.)
- Solo devuelve JSON válido, sin texto adicional`;
