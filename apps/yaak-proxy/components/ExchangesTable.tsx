import type { HttpExchange, ProxyHeader } from "@yaakapp-internal/proxy-lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TruncatedWideTableCell,
} from "@yaakapp-internal/ui";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

interface Props {
  exchanges: HttpExchange[];
  style?: React.CSSProperties;
  className?: string;
}

export function ExchangesTable({ exchanges, style, className }: Props) {
  const { t } = useTranslation();
  if (exchanges.length === 0) {
    return <p className="text-text-subtlest text-sm">{t("noTraffic")}</p>;
  }

  return (
    <div className={className} style={style}>
      <Table scrollable className="px-2">
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("method")}</TableHeaderCell>
            <TableHeaderCell>URL</TableHeaderCell>
            <TableHeaderCell>{t("status")}</TableHeaderCell>
            <TableHeaderCell>{t("type")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {exchanges.map((ex) => (
            <TableRow key={ex.id}>
              <TableCell className="font-mono text-2xs">{ex.method}</TableCell>
              <TruncatedWideTableCell className="font-mono text-2xs">
                {ex.url}
              </TruncatedWideTableCell>
              <TableCell>
                <StatusBadge status={ex.resStatus} error={ex.error} />
              </TableCell>
              <TableCell className="text-text-subtle text-xs">
                {getContentType(ex.resHeaders)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status, error }: { status: number | null; error: string | null }) {
  const { t } = useTranslation();
  if (error) return <span className="text-xs text-danger">{t("error")}</span>;
  if (status == null) return <span className="text-xs text-text-subtlest">—</span>;

  const color =
    status >= 500
      ? "text-danger"
      : status >= 400
        ? "text-warning"
        : status >= 300
          ? "text-notice"
          : "text-success";

  return <span className={classNames("text-xs font-mono", color)}>{status}</span>;
}

function getContentType(headers: ProxyHeader[]): string {
  const ct = headers.find((h) => h.name.toLowerCase() === "content-type")?.value;
  if (ct == null) return "—";
  // Strip parameters (e.g. "; charset=utf-8")
  return ct.split(";")[0]?.trim() ?? ct;
}
