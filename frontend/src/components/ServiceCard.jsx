import React from 'react';

const ServiceCard = ({ icon: Icon, title, count, color = 'bg-indigo-400', notification }) => {
  const isWhite = color === 'bg-white' || color === 'white';
  return (
    <div className={`service-card rounded-xl p-5 flex flex-col items-center justify-center min-h-[140px] transition hover:shadow-lg cursor-pointer ${isWhite ? 'bg-white border' : color}`}>
      <div className="relative icon-wrap flex items-center justify-center w-14 h-14 mb-3">
        <span className="badge absolute" style={{display: notification ? 'block' : 'none'}}>{notification}</span>
        {isWhite ? (
            <div className="icon-circle w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Icon className="icon-svg" />
            </div>
          ) : (
            <Icon className="icon-svg" />
          )}
      </div>
      <div className={`${isWhite ? 'text-gray-700' : 'text-white'} font-semibold text-lg mb-1 title`}>{title}</div>
      {typeof count === 'number' && <div className={`${isWhite ? 'text-gray-500' : 'text-white'} text-sm opacity-80 count`}>{count}</div>}
    </div>
  );
};

export default ServiceCard;
