import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, AlertCircle, Filter } from "lucide-react";
import { useState, useMemo } from "react";

interface AnalyticsTableProps {
  analytics: any;
  loading?: boolean;
}

const AnalyticsTable = ({ analytics, loading = false }: AnalyticsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const tableData = analytics?.userAnalytics || [];

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter((row: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (row.email || '').toLowerCase().includes(searchLower) ||
        (row.userId || '').toLowerCase().includes(searchLower) ||
        (row.planId || '').toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    filtered.sort((a: any, b: any) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tableData, searchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tableData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="h-5 w-5" />
            <span>No analytics data available. Data will appear once users start using the platform.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="text-lg font-semibold">Detailed Analytics</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search users, plans..." 
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search analytics data"
              />
            </div>
            <Button variant="outline" size="sm" aria-label="Filter analytics data">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Analytics data table">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('email')}
                  role="columnheader"
                  aria-sort={sortField === 'email' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  User
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('planId')}
                  role="columnheader"
                  aria-sort={sortField === 'planId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Plan
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalWorkflows')}
                  role="columnheader"
                  aria-sort={sortField === 'totalWorkflows' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Total Workflows
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalOverages')}
                  role="columnheader"
                  aria-sort={sortField === 'totalOverages' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Total Overages
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalRevenue')}
                  role="columnheader"
                  aria-sort={sortField === 'totalRevenue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Total Revenue
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('riskLevel')}
                  role="columnheader"
                  aria-sort={sortField === 'riskLevel' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((row: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.email || row.userId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <Badge variant="outline" className="capitalize">
                      {row.planId}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.totalWorkflows?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.totalOverages?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">${row.totalRevenue?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={row.riskLevel === "high" ? "destructive" : row.riskLevel === "medium" ? "secondary" : "default"}
                      className={`capitalize ${
                        row.riskLevel === "high" ? "bg-red-100 text-red-700" : 
                        row.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : 
                        "bg-green-100 text-green-700"
                      }`}
                    >
                      {row.riskLevel || 'low'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-600">
            Showing {filteredAndSortedData.length} of {tableData.length} entries
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </span>
          <div className="text-sm text-gray-500">
            Click column headers to sort
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTable; 