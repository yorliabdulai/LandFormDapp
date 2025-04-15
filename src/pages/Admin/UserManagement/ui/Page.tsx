import React, { useState} from "react";
import { useWatchContractEvent } from "wagmi";
import { LandFormABI, CONTRACT_ADDRESS } from "@/constants/contracts";
import { formatAddress } from "@/utils/formatAddress";
import { Users, Search, ArrowUpDown } from "lucide-react";

interface UserData {
  address: string;
  totalInvestments: number;
  lastActive: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserData;
    direction: "ascending" | "descending";
  }>({
    key: "totalInvestments",
    direction: "descending",
  });

  // Listen for the Invested event from the contract
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LandFormABI,
    eventName: "Invested",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (!log.data) return;
        
        // Based on your ABI, the Invested event has these parameters:
        // projectId (indexed uint256), investor (address), shares (uint256)
        const {  investor, shares } = log.data as unknown as { projectId: bigint; investor: string; shares: bigint };
        
        if (!investor) {
          console.error("Investor address is missing in the log.");
          return;
        }
        
        const investorAddress = investor.toString().toLowerCase();
        const now = new Date().toLocaleString();
        const shareAmount = Number(shares);

        setUsers((prev) => {
          const index = prev.findIndex((u) => u.address === investorAddress);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              totalInvestments: updated[index].totalInvestments + shareAmount,
              lastActive: now,
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                address: investorAddress,
                totalInvestments: shareAmount,
                lastActive: now,
              },
            ];
          }
        });
      });
    },
  });

  // Sort users based on the current sortConfig
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    return sortedUsers.filter((user) =>
      user.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedUsers, searchTerm]);

  // Handle sort request
  const requestSort = (key: keyof UserData) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Users size={24} className="text-primary-600 mr-2" />
          <h1 className="text-2xl font-heading font-bold text-gray-800">User Management</h1>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search wallet address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No investment activity recorded yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            User information will appear here after investors participate in projects.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("address")}
                >
                  <div className="flex items-center">
                    Wallet Address
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("totalInvestments")}
                >
                  <div className="flex items-center">
                    Total Investments (shares)
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort("lastActive")}
                >
                  <div className="flex items-center">
                    Last Active
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.address} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-primary-600 text-xs font-medium">
                          {user.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{formatAddress(user.address)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Investor</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{user.totalInvestments.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Purchased shares</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{user.lastActive}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Last transaction</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;