import OpenAI from "openai";

export async function analyzeChangelogWithGPT4(changelog: string, version: string): Promise<boolean | null> {
  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama",
  });

  const prompt = `
  Eres un experto en análisis de cambios en librerías de software.
  Analiza el siguiente changelog y determina si actualizar desde la versión "${version}"
  a cualquier versión más nueva implicaría breaking changes.
  
  Instrucciones:
  • El changelog sigue un formato en el que cada versión está indicada como un título (por ejemplo, ## 2.6.0) y debajo de cada versión se listan los cambios correspondientes.
  • Los cambios pueden estar categorizados explícitamente con etiquetas como feature, fix, breaking change, siguiendo convenciones como Conventional Commits.
  • En otros casos, los breaking changes pueden estar indicados dentro del texto con términos como:
  • “breaking change”, "BREAKING CHANGE" “breaking”, “removal”, “deprecated and removed”, “major change”, “incompatible”, “requires migration”, “not backward compatible”, o cualquier otra frase que sugiera pérdida de compatibilidad.
  • Si después de la versión "${version}" hay al menos un cambio que pueda romper compatibilidad, responde con:
  • “Sí” si hay breaking changes.
  • “No” si no hay breaking changes.
  • “No estoy seguro” si la información no es clara o no se puede determinar con certeza.

  Solo responde Si, No, No estoy seguro.

  Changelog:
  "${changelog}"
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-r1:7b",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0].message.content!.trim().toLowerCase();


    if (result.includes("sí")) return true;
    if (result.includes("no estoy seguro")) return false;
    return null;
  } catch (error) {
    console.error("❌ Error communicating with OpenAI:", error);
    return null;
  }
}