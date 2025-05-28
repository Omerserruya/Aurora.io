import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Link,
  CircularProgress,
  Divider,
  styled,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

// User type definition
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  authProvider: 'google' | 'github' | 'local';
  fullName: string;
  createdAt: string;
  lastLogin: string;
}

// Column definition interface
interface Column {
  id: keyof User | 'actions';
  label: string;
  width: number;
  align?: 'right' | 'left' | 'center';
}

// Custom styled resizable header cell
const ResizableTableCell = styled(TableCell)<{ width: number }>(({ theme, width }) => ({
  position: 'relative',
  width: width,
  minWidth: 80,
  boxSizing: 'border-box',
  cursor: 'default',
  '&:hover .resizer': {
    opacity: 1,
  }
}));

// Resizer component
const Resizer = styled('div')({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '5px',
  background: 'rgba(0, 0, 0, 0.1)',
  cursor: 'col-resize',
  opacity: 0,
  transition: 'opacity 0.3s',
  '&:hover, &.isResizing': {
    opacity: 1,
    background: 'rgba(0, 0, 0, 0.2)',
  }
});

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Column definitions with initial widths
  const [columns, setColumns] = useState<Column[]>([
    { id: 'username', label: 'User Name', width: 150 },
    { id: 'email', label: 'Email', width: 220 },
    { id: 'role', label: 'Role', width: 120 },
    { id: 'authProvider', label: 'Auth Provider', width: 120 },
    { id: 'lastLogin', label: 'Last Login', width: 160 },
    { id: 'createdAt', label: 'Created At', width: 160 },
    { id: 'actions', label: 'Actions', width: 120, align: 'right' }
  ]);

  // State for tracking resizing
  const [resizing, setResizing] = useState<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Fetched users data:', data); // Debug log
      setUsers(data);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (userId: string) => {
    console.log('Editing user with ID:', userId); // Debug log
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/admin/users/create');
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        // Refresh the user list after deletion
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const getAuthProviderColor = (provider: string) => {
    switch (provider) {
      case 'google': return 'error';
      case 'github': return 'info';
      case 'local': return 'success';
      default: return 'default';
    }
  };

  // Column resizing handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    const column = columns[columnIndex];
    setResizing({
      columnIndex,
      startX: e.clientX,
      startWidth: column.width
    });

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [columns]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;

    const { columnIndex, startX, startWidth } = resizing;
    const newWidth = Math.max(80, startWidth + (e.clientX - startX));
    
    setColumns(prevColumns => 
      prevColumns.map((col, index) => 
        index === columnIndex ? { ...col, width: newWidth } : col
      )
    );
  }, [resizing]);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (resizing) {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      }
    };
  }, [resizing, handleResizeMove, handleResizeEnd]);

  // Render cell content based on column type
  const renderCellContent = (user: User, columnId: keyof User | 'actions') => {
    if (columnId === 'actions') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => handleEditUser(user._id)}
            aria-label="edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteUser(user._id)}
            aria-label="delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    } else if (columnId === 'username') {
      return (
        <Link
          component="button"
          variant="body2"
          onClick={() => handleEditUser(user._id)}
          underline="hover"
          sx={{ fontWeight: 'medium' }}
        >
          {user[columnId]}
        </Link>
      );
    } else if (columnId === 'authProvider') {
      return (
        <Chip 
          label={user[columnId]} 
          color={getAuthProviderColor(user[columnId]) as "error" | "info" | "success" | "default"}
          size="small" 
        />
      );
    } else if (columnId === 'lastLogin' || columnId === 'createdAt') {
      return new Date(user[columnId]).toLocaleString();
    } else {
      return user[columnId as keyof User];
    }
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 600, width: '100%', overflow: 'auto' }}>
            <Table 
              ref={tableRef}
              stickyHeader 
              aria-label="sticky table" 
              sx={{ borderCollapse: 'separate', borderSpacing: 0 }}
            >
              <TableHead>
                <TableRow sx={{ 
                  '& th': { 
                    backgroundColor: 'background.default', 
                    color: 'text.primary',
                    fontWeight: 'bold',
                    borderBottom: '2px solid',
                    borderBottomColor: 'divider',
                    whiteSpace: 'nowrap'
                  }
                }}>
                  {columns.map((column, index) => (
                    <ResizableTableCell 
                      key={column.id}
                      width={column.width} 
                      align={column.align || 'left'}
                    >
                      {column.label}
                      <Resizer 
                        className={resizing?.columnIndex === index ? 'isResizing' : ''}
                        onMouseDown={(e) => handleResizeStart(e, index)}
                      />
                    </ResizableTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow 
                        hover 
                        key={user._id} 
                        sx={{ 
                          '&:last-child td, &:last-child th': { 
                            borderBottom: 0 
                          }
                        }}
                      >
                        {columns.map((column) => (
                          <TableCell 
                            key={`${user._id}-${column.id}`}
                            align={column.align || 'left'}
                            sx={{ 
                              width: column.width,
                              minWidth: 80 
                            }}
                          >
                            {renderCellContent(user, column.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            sx={{ 
              borderTop: '1px solid',
              borderTopColor: 'divider',
              '.MuiTablePagination-toolbar': {
                paddingLeft: 1
              }
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
} 