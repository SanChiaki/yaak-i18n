import { showPromptForm } from "../../lib/prompt-form";
import { Banner, InlineCode } from "@yaakapp-internal/ui";
import i18n from "../../i18n";

export interface GitCredentials {
  username: string;
  password: string;
}

export async function promptCredentials({
  url: remoteUrl,
  error,
}: {
  url: string;
  error: string | null;
}): Promise<GitCredentials | null> {
  const isGitHub = /github\.com/i.test(remoteUrl);
  const userLabel = isGitHub
    ? i18n.t("workspace:git.githubUsername")
    : i18n.t("workspace:git.username");
  const passLabel = isGitHub
    ? i18n.t("workspace:git.githubToken")
    : i18n.t("workspace:git.passwordToken");
  const userDescription = isGitHub ? i18n.t("workspace:git.githubUsernameHelp") : undefined;
  const passDescription = isGitHub
    ? i18n.t("workspace:git.githubTokenHelp")
    : i18n.t("workspace:git.passwordTokenHelp");
  const r = await showPromptForm({
    id: "git-credentials",
    title: i18n.t("workspace:git.credentialsRequired"),
    description: error ? (
      <Banner color="danger">{error}</Banner>
    ) : (
      <>
        {i18n.t("workspace:git.enterCredentials")} <InlineCode>{remoteUrl}</InlineCode>
      </>
    ),
    inputs: [
      { type: "text", name: "username", label: userLabel, description: userDescription },
      {
        type: "text",
        name: "password",
        label: passLabel,
        description: passDescription,
        password: true,
      },
    ],
  });
  if (r == null) return null;

  const username = String(r.username || "");
  const password = String(r.password || "");
  return { username, password };
}
