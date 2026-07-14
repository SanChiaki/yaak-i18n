import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CreateWorkspaceDialog } from "../components/CreateWorkspaceDialog";
import { showDialog } from "../lib/dialog";

export function useCreateWorkspace() {
  const { t } = useTranslation();
  return useCallback(() => {
    showDialog({
      id: "create-workspace",
      title: t("workspace:workspace.create"),
      size: "sm",
      render: ({ hide }) => <CreateWorkspaceDialog hide={hide} />,
    });
  }, [t]);
}
