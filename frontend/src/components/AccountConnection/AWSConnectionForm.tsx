import React from 'react';
import { Box, Stepper, Step, StepLabel, Button, Paper } from '@mui/material';
import AboutStep from './AboutStep';
import CredentialsStep from './CredentialsStep';
import OverviewStep from './OverviewStep';
import { AWSConnectionFormData, AWSConnection } from '../../types/awsConnection';
import { useUser } from '../../hooks/compatibilityHooks';
import { validateAwsCredentials } from '../../api/awsConnectionApi';

const steps = [
  { label: 'About', description: 'Connection Details' },
  { label: 'Credentials', description: 'AWS Credentials' },
  { label: 'Validate', description: 'Validate Credentials' },
  { label: 'Overview', description: 'Review & Create' }
];

const initialFormData: AWSConnectionFormData = {
  step1: {
    name: '',
    provider: 'aws',
    region: '',
    description: ''
  },
  step2: {
    accessKeyId: '',
    secretAccessKey: ''
  },
  step3: {
    accounts: []
  },
  step4: {
    isValid: undefined
  }
};

interface AWSConnectionFormProps {
  onSubmit: (connection: AWSConnection) => Promise<AWSConnection>;
  onCancel: () => void;
}

export default function AWSConnectionForm({ onSubmit, onCancel }: AWSConnectionFormProps) {
  const { user } = useUser();
  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState<AWSConnectionFormData>(initialFormData);
  const [isValidating, setIsValidating] = React.useState(false);
  const [containerId, setContainerId] = React.useState<string | null>(null);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepChange = (step: number, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [`step${step + 1}`]: data
    }));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setContainerId(null);
    
    try {
      if (!user) {
        throw new Error('No user found in Redux state');
      }
      
      // Use the real AWS credentials validation from CloudQuery service
      const validationResult = await validateAwsCredentials({
        accessKeyId: formData.step2.accessKeyId,
        secretAccessKey: formData.step2.secretAccessKey,
        region: formData.step1.region
      });
      
      // Check if validation was successful
      if (validationResult.valid === true) {
        // Store the containerId for later reference
        if (validationResult.containerId) {
          setContainerId(validationResult.containerId);
        }
        // Set the validation result
        handleStepChange(3, { isValid: true });
        
        // Proceed to next step automatically after validation
        setTimeout(() => {
          handleNext();
        }, 1500);
      } else {
        // Handle invalid credentials - update the UI state only
        handleStepChange(3, { isValid: false });
      }
    } catch (error) {
      // One simple catch for all errors - update the UI state only
      console.error('Validation error:', error);
      handleStepChange(3, { isValid: false });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user || !formData.step4.isValid || !containerId) {
        throw new Error('Validation required');
      }

      const connection: AWSConnection = {
        userId: user._id,
        name: formData.step1.name,
        provider: 'aws',
        description: formData.step1.description,
        credentials: {
          accessKeyId: formData.step2.accessKeyId,
          secretAccessKey: formData.step2.secretAccessKey,
          region: formData.step1.region,
          sessionToken: undefined
        },
        accounts: formData.step3.accounts,
        isValidated: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Submit the connection data
      const newConnection = await onSubmit(connection);
      
      // If connection was created successfully, trigger a cloud query
      if (newConnection && newConnection._id) {
        try {
          // Execute cloud query for the new connection
          const { executeCloudQuery } = await import('../../api/awsConnectionApi');
          await executeCloudQuery(newConnection._id);
          console.log('Initial cloud query started for new connection');
        } catch (syncError) {
          console.error('Failed to start initial cloud query:', syncError);
          // Don't throw this error as the connection was still created successfully
        }
      }
    } catch (error) {
      // Handle submission error by updating the validation state
      console.error('Submission error:', error);
      handleStepChange(3, { isValid: false });
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <AboutStep
            formData={formData.step1}
            onChange={(data) => handleStepChange(0, data)}
          />
        );
      case 1:
        return (
          <CredentialsStep
            formData={formData.step2}
            onChange={(data) => handleStepChange(1, data)}
          />
        );
      case 2:
        return (
          <OverviewStep
            formData={{
              ...formData,
              step3: { accounts: [] }  // Empty accounts for validation step
            }}
            isValidating={isValidating}
            isValid={formData.step4.isValid}
            validationOnly={true}
          />
        );
      case 3:
        return (
          <OverviewStep
            formData={formData}
            isValidating={false}
            isValid={formData.step4.isValid}
            validationOnly={false}
          />
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (activeStep === 0) {
      // Check if About step fields are filled
      return !formData.step1.name || !formData.step1.region;
    }
    if (activeStep === 1) {
      // Check if Credentials step fields are filled
      return !formData.step2.accessKeyId || !formData.step2.secretAccessKey;
    }
    return false;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>
                <div>
                  <div>{step.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {step.description}
                  </div>
                </div>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>
              Back
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.step4.isValid}
            >
              Create Connection
            </Button>
          ) : activeStep === 2 ? (
            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 