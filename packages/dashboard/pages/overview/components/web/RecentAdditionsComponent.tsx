import React from 'react';
import { Trees, FileText } from 'lucide-react';

// Sample data array
const recentAdditions = [
  {
    id: 1,
    name: "Olivia Martin",
    date: "Jan 9, 2024",
    value: "4,100",
    type: "trees",
    gender: "woman"
  },
  {
    id: 2,
    name: "Jackson Lee",
    date: "Jan 9, 2024",
    value: "12",
    type: "hectares",
    gender: "man"
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    date: "Jan 6, 2024",
    value: "7,100",
    type: "trees",
    gender: "woman"
  },
  {
    id: 4,
    name: "William Kim",
    email: "will@email.com",
    value: "1,200",
    type: "trees",
    gender: "man"
  },
  {
    id: 5,
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    value: "5",
    type: "hectares",
    gender: "woman"
  },
];

// User Avatar component using the avatar service
const UserAvatar = ({ index, name }) => {

  return (
    <div className="w-12 h-12 rounded-full mr-4 overflow-hidden">
      <img 
        src={`https://avatar.iran.liara.run/public/${index+1}`} 
        alt={`${name}'s avatar`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const RecentAdditionsComponent = () => {
  return (
    <div className="bg-white rounded-2xl shadow p-6 max-w-3xl w-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl font-bold text-gray-900">Recent Additions</h2>
        <button className="text-gray-600 font-medium hover:text-gray-900">
          View All
        </button>
      </div>
      
      <p className="text-gray-500 mb-8">
        You added 72 interventions this month.
      </p>
      
      <ul className="space-y-6">
        {recentAdditions.map((item, index) => (
          <li key={item.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <UserAvatar index={index} name={item.name} />
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-gray-500">
                  {item.date || item.email}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-semibold mr-2">
                {item.value} {item.type === "hectares" ? "ha" : ""}
              </span>
              <div className="text-gray-700">
                {item.type === "trees" ? (
                  <Trees size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentAdditionsComponent;