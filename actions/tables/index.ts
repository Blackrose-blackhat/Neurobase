export const getDefaultVisibleColumns = (columns: string[]): string[] => {
    const essentialColumns = columns.filter(col => 
      col.toLowerCase().includes('id') || 
      col.toLowerCase().includes('name') || 
      col.toLowerCase().includes('title') ||
      col.toLowerCase().includes('email')
    );
    
    if (essentialColumns.length > 3) {
      return essentialColumns.slice(0, 3);
    }
    
    const remainingColumns = columns.filter(col => !essentialColumns.includes(col));
    return [...essentialColumns, ...remainingColumns.slice(0, 3 - essentialColumns.length)];
  };
  