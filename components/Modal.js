export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: "2px 10px", fontSize: 16 }}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
