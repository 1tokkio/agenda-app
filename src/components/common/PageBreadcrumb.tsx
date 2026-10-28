import Link from "next/link";
import { AngleRightIcon } from "@/components/icons";

interface BreadcrumbProps {
  pageTitle: string;
  actions?: React.ReactNode;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{pageTitle}</h2>
    <div className="flex flex-wrap items-center gap-3">
      {actions}
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" href="/admin">
              Inicio
              <AngleRightIcon className="size-4" />
            </Link>
          </li>
          <li className="text-sm text-gray-800 dark:text-white/90">{pageTitle}</li>
        </ol>
      </nav>
    </div>
  </div>
);

export default PageBreadcrumb;
