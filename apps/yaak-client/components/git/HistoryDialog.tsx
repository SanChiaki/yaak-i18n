import { useGitLog } from "@yaakapp-internal/git";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TruncatedWideTableCell,
} from "@yaakapp-internal/ui";

export function HistoryDialog({ dir }: { dir: string }) {
  const { t, i18n } = useTranslation();
  const log = useGitLog(dir);

  return (
    <div className="pl-5 pr-1 pb-1">
      <Table scrollable className="px-1">
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("workspace:git.message")}</TableHeaderCell>
            <TableHeaderCell>{t("workspace:git.author")}</TableHeaderCell>
            <TableHeaderCell>{t("workspace:git.when")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(log.data ?? []).map((l) => (
            <TableRow key={l.oid}>
              <TruncatedWideTableCell>
                {l.message || <em className="text-text-subtle">{t("workspace:git.noMessage")}</em>}
              </TruncatedWideTableCell>
              <TableCell>
                <span title={`${t("workspace:git.email")}: ${l.author.email}`}>
                  {l.author.name || t("common:unknown")}
                </span>
              </TableCell>
              <TableCell className="text-text-subtle">
                <span title={l.when}>
                  {formatDistanceToNowStrict(l.when, {
                    addSuffix: true,
                    locale: i18n.resolvedLanguage === "zh-CN" ? zhCN : enUS,
                  })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
