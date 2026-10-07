import { PIE_COLORS } from "./pie-split";

type AddressFieldProps = {
  index: number;
  name: string;
  address: string;
  bps: number;
  canRemove: boolean;
  onChange: (field: "name" | "address" | "bps", value: string | number) => void;
  onRemove: () => void;
};

export function AddressField({
  index,
  name,
  address,
  bps,
  canRemove,
  onChange,
  onRemove,
}: AddressFieldProps) {
  return (
    <fieldset className="recipient-field">
      <legend>
        <span
          aria-hidden="true"
          className="slice-dot"
          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
        />
        Person {index + 1}
      </legend>
      <div className="grid min-w-0 gap-4">
        <label className="field-label">
          Name
          <input
            value={name}
            maxLength={30}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="e.g. Alex"
            className="field-input"
          />
        </label>
        <label className="field-label">
          Solana wallet
          <input
            required
            value={address}
            onChange={(event) => onChange("address", event.target.value)}
            placeholder="Public address"
            spellCheck={false}
            className="field-input font-mono text-sm"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="field-label min-w-32 flex-1">
            Percentage
            <div className="field-group flex">
              <input
                required
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={(bps / 100).toFixed(2)}
                onChange={(event) =>
                  onChange("bps", Math.round(Number(event.target.value) * 100))
                }
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
              />
              <span className="text-muted self-center pr-4">%</span>
            </div>
          </label>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="button-danger text-sm"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
