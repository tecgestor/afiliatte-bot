const Alert = ({ type = 'info', title, message, show = true, onClose }) => {
  if (!show) return null;

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',  
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`rounded-md p-4 border ${colors[type]}`}>
      <div className="flex">
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {message && <p className={`text-sm ${title ? 'mt-2' : ''}`}>{message}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-3 text-sm font-medium underline">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;