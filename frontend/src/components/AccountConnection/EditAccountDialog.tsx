import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AWSConnection } from '../../types/awsConnection';
import { validateAwsCredentials, executeCloudQuery } from '../../api/awsConnectionApi';

interface EditAccountDialogProps {
  open: boolean;
  onClose: () => void;
  connection: AWSConnection;
  onSubmit: (connection: AWSConnection) => Promise<AWSConnection>;
  onDelete: (connectionId: string) => Promise<void>;
}

export default function EditAccountDialog({
  open,
  onClose,
  connection,
  onSubmit,
  onDelete
}: EditAccountDialogProps) {
  const [name, setName] = useState(connection.name);
  const [description, setDescription] = useState(connection.description || '');
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async () => {
    try {
      const updatedConnection: AWSConnection = {
        ...connection,
        name,
        description
      };

      if (isEditingCredentials) {
        updatedConnection.credentials = {
          ...connection.credentials,
          accessKeyId,
          secretAccessKey
        };
      }

      await onSubmit(updatedConnection);
      onClose();
    } catch (error) {
      console.error('Error updating connection:', error);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateAwsCredentials({
        accessKeyId,
        secretAccessKey,
        region: connection.credentials.region
      });

      if (result.valid) {
        await handleSubmit();
        // Execute cloud query for updated credentials
        if (connection._id) {
          try {
            await executeCloudQuery(connection._id);
            console.log('Cloud query started for updated connection');
          } catch (syncError) {
            console.error('Failed to start cloud query after credential update:', syncError);
            // Don't throw this error as the connection was still updated successfully
          }
        }
      } else {
        setValidationError('Invalid credentials. Please check and try again.');
      }
    } catch (error: any) {
      let message = 'Failed to validate credentials. Please try again.';
      if (error && error.message) {
        message = error.message;
      }
      if (error && error.response && typeof error.response.json === 'function') {
        try {
          const data = await error.response.json();
          if (data && data.message) {
            message = data.message;
          }
        } catch {}
      }
      setValidationError(message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      setIsDeleting(true);
      try {
        await onDelete(connection._id!);
        onClose();
      } catch (error) {
        console.error('Error deleting connection:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Edit AWS Connection
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Connection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Region: {connection.credentials.region}
          </Typography>

          {!isEditingCredentials ? (
            <Button
              variant="outlined"
              onClick={() => setIsEditingCredentials(true)}
              sx={{ mt: 2 }}
            >
              Update Credentials
            </Button>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Update Credentials
              </Typography>
              <TextField
                fullWidth
                label="Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Secret Access Key"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                margin="normal"
                required
                type="password"
              />
              {validationError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {validationError}
                </Alert>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Connection'}
            </Button>
            <Box>
              <Button onClick={onClose} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={isEditingCredentials ? handleValidate : handleSubmit}
                disabled={isValidating || isDeleting}
              >
                {isValidating ? 'Validating...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 