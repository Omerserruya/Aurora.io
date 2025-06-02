import React from 'react';
import { Typography, Grid } from '@mui/material';
import { AWSNodeDataTypes } from '../awsNodes';

/**
 * Format a single detail field
 */
const DetailField: React.FC<{ label: string, value: string | React.ReactNode }> = ({ label, value }) => (
  <Grid container spacing={1} sx={{ mb: 0.5, fontSize: '0.75rem' }}>
    <Grid item xs={5}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
        {label}:
      </Typography>
    </Grid>
    <Grid item xs={7}>
      <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Grid>
  </Grid>
);

/**
 * Get resource details based on the node data
 */
export function getResourceDetails(data: AWSNodeDataTypes): React.ReactNode {
  switch (data.type) {
    case 'vpc':
      return (
        <>
          <DetailField label="VPC ID" value={data.VpcId} />
          <DetailField label="CIDR Block" value={data.CidrBlock} />
        </>
      );
      
    case 'subnet':
      return (
        <>
          <DetailField label="Subnet ID" value={data.SubnetId} />
          <DetailField label="CIDR Block" value={data.CidrBlock} />
          <DetailField label="VPC" value={data.VpcId} />
        </>
      );
      
    case 'ec2':
      return (
        <>
          <DetailField label="Instance ID" value={data.InstanceId} />
          <DetailField label="Type" value={data.InstanceType} />
          <DetailField label="Subnet" value={data.SubnetId} />
        </>
      );
      
    case 'security_group':
      return (
        <>
          <DetailField label="Group ID" value={data.GroupId} />
          <DetailField label="Name" value={data.GroupName} />
          <DetailField label="VPC" value={data.VpcId} />
        </>
      );
      
    case 'route_table':
      return (
        <>
          <DetailField label="Route Table ID" value={data.RouteTableId} />
          <DetailField label="VPC" value={data.VpcId} />
          <DetailField label="Routes" value={`${data.Routes?.length || 0} routes`} />
        </>
      );
      
    case 'internet_gateway':
      return (
        <>
          <DetailField label="Gateway ID" value={data.InternetGatewayId} />
          <DetailField label="Attachments" value={`${data.Attachments?.length || 0} VPCs`} />
        </>
      );
      
    case 'nat_gateway':
      return (
        <>
          <DetailField label="Gateway ID" value={data.NatGatewayId} />
          <DetailField label="Subnet" value={data.SubnetId} />
          <DetailField label="VPC" value={data.VpcId} />
        </>
      );
      
    case 'load_balancer':
      return (
        <>
          <DetailField label="Name" value={data.LoadBalancerName} />
          <DetailField label="Type" value={data.Type} />
          <DetailField label="Scheme" value={data.Scheme} />
        </>
      );
      
    case 'lambda_function':
      return (
        <>
          <DetailField label="Function" value={data.FunctionName} />
          <DetailField label="Runtime" value={data.Runtime} />
        </>
      );
      
    default:
      return (
        <Typography variant="caption">
          {data.resourceId}
        </Typography>
      );
  }
} 