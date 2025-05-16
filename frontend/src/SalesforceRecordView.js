import Reac, { useState } from 'react';
import { IconButton, Stack, Box, Grid, Typography, Divider, Button, Paper, TextField } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const SalesforceRecordView = () => {
  const [record, setRecord] = useState({})

  const onMagicWand = () => {
    console.log('oh oh its magic')
  }

  const leftActivityFields = [
  { label: 'Activity Name' },
  { label: 'Start Date' },
  { label: 'End Date' },
  { label: 'Exclude Package Details' },
  { label: 'PicOS' },
];
const rightActivityFields = [
  { label: 'Activity Type' },
  { label: 'Sell Enablers' },
  { label: '% Of Stores' },
  { label: 'Price Type' },
  { label: 'Market Street Challenge' },
  { label: 'Late-break' },
];

const leftActivityDetailsFields = [
  { label: 'Pricing', multiline: false },
  { label: 'Channel', multiline: false },
  { label: 'POI', multiline: false },
];

const rightActivityDetailsFields = [
  {
    label: 'Execution Details', multiline: true, icon: <IconButton onClick={onMagicWand} sx={{p: 0}}>
      <AutoFixHighIcon fontSize="small" color="primary" />
    </IconButton>
  },
];

  const handleChange = (e) => {
    const { name, value } = e.target
    const _record = { ...record }
    _record[name] = value
    setRecord(_record)
  }

  const renderFieldGroup = (fields) => (
    fields.map(({ label, multiline, icon }) => (
      <Box
        key={label}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 1,
        }}
      >
        <Stack direction='row' sx={{alignItems: 'center'}}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textAlign: 'left' }}>
            {label}
          </Typography>
          &nbsp;
          &nbsp;
          {icon}
        </Stack>
        <TextField
          name={label}
          onChange={handleChange}
          variant='standard'
          value={record[label]}
          multiline={multiline}
        />
      </Box>
    ))
  );

  return (
    <Paper elevation={1} sx={{ p: 2, width: '90%', mx: 'auto', mt: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2 }}>
        Activity Types and Dates
      </Typography>
      <Grid container spacing={1} sx={{ width: '100%', marginBottom: 4 }}>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '48%' }}>
          {renderFieldGroup(leftActivityFields)}
        </Grid>
        <Grid item xs={6} md={6} sx={{ flexBasis: '48%' }}>
          {renderFieldGroup(rightActivityFields)}
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2 }}>
        Activity Details
      </Typography>

      <Grid container spacing={1} sx={{ width: '100%', marginBottom: 4 }}>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '48%' }}>
          {renderFieldGroup(leftActivityDetailsFields)}
        </Grid>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '48%' }}>
          {renderFieldGroup(rightActivityDetailsFields)}
        </Grid>
      </Grid>
      {/* <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button variant="contained" color="primary">
          Edit
        </Button>
      </Box> */}
    </Paper>
  );
};

export default SalesforceRecordView;
