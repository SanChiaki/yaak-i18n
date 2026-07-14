import type { AnyModel } from "@yaakapp-internal/models";
import { deleteModel } from "@yaakapp-internal/models";
import { InlineCode } from "@yaakapp-internal/ui";
import { Prose } from "../components/Prose";
import { showConfirmDelete } from "./confirm";
import i18n from "../i18n";
import { resolvedModelName } from "./resolvedModelName";

export async function deleteModelWithConfirm(
  model: AnyModel | AnyModel[] | null,
  options: { confirmName?: string } = {},
): Promise<boolean> {
  if (model == null) {
    console.warn("Tried to delete null model");
    return false;
  }
  const models = Array.isArray(model) ? model : [model];
  const firstModel = models[0];
  if (firstModel == null) return false;

  const firstModelName = resolvedModelName(firstModel);
  const confirmed = await showConfirmDelete({
    id: `delete-model-${models.map((m) => m.id).join(",")}`,
    title:
      models.length === 1
        ? i18n.t("common:deleteModel.titleOne", { name: firstModelName })
        : i18n.t("common:deleteModel.titleMany", { count: models.length }),
    requireTyping: options.confirmName,
    description: (
      <>
        {models.length === 1 ? (
          i18n.t("common:deleteModel.descriptionOne", { name: firstModelName })
        ) : models.length < 10 ? (
          <>
            {i18n.t("common:deleteModel.descriptionMany")}
            <Prose className="mt-2">
              <ul>
                {models.map((m) => (
                  <li key={m.id}>
                    <InlineCode>{resolvedModelName(m)}</InlineCode>
                  </li>
                ))}
              </ul>
            </Prose>
          </>
        ) : (
          i18n.t("common:deleteModel.descriptionAll", { count: models.length })
        )}
      </>
    ),
  });

  if (!confirmed) {
    return false;
  }

  await Promise.allSettled(models.map((m) => deleteModel(m)));
  return true;
}
