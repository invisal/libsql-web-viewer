import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DatabaseTableConstraintChange,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { Dispatch, SetStateAction } from "react";
import ConstraintForeignKeyEditor from "./constraint-foreign-key";

interface Props {
  selectedColumns: Set<string>;
  constraints: DatabaseTableConstraintChange[];
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
  onClose: () => void;
}

export function SchemaEditorForeignKey(props: Props) {
  console.log(props);
  return (
    <Dialog open onOpenChange={props.onClose}>
      <DialogContent>
        <DialogTitle>Foreign Key</DialogTitle>
        <DialogDescription>
          <div className="mx-[-1.5rem]">
            <table className="font-mono">
              <tbody>
                {props.constraints
                  .filter((x) => props.selectedColumns.has(x.id))
                  .map((x, idx) => {
                    return (
                      <tr key={x.id}>
                        <td className="border-b border-r border-t bg-muted p-2 text-right align-top text-sm">
                          {idx + 1}
                        </td>
                        <td className="relative w-[31rem] overflow-hidden border-b border-r border-t p-2 text-sm">
                          <ConstraintForeignKeyEditor
                            value={x}
                            onChange={props.onChange}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
