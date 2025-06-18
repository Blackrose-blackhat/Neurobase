import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Database, Table as TableIcon } from "lucide-react";

interface DatabaseOverviewProps {
  data: {
    databaseName: string;
    collections: Array<{
      collection: string;
      documentCount: number;
      importantFields: string[];
      sampleData: any[];
    }>;
  };
}

export function DatabaseOverview({ data }: DatabaseOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Database className="h-6 w-6" />
        <span>Database: {data.databaseName}</span>
      </div>

      <div className="grid gap-6">
        {data.collections.map((collection) => (
          <Card key={collection.collection} className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                <h3 className="text-lg font-medium">{collection.collection}</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                {collection.documentCount} documents
              </div>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Important Fields:
              </h4>
              <div className="flex flex-wrap gap-2">
                {collection.importantFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            {collection.sampleData.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      {collection.importantFields.map((field) => (
                        <th key={field} className="text-left">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {collection.sampleData.map((doc, idx) => (
                      <tr key={idx}>
                        {collection.importantFields.map((field) => (
                          <td key={field} className="max-w-[200px] truncate">
                            {String(doc[field] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 