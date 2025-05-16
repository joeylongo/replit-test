import Reac, { useState } from 'react';
import { Box, Grid, Typography, Divider, Button, Paper, TextField } from '@mui/material';

const activityTypeFields = [
  { label: 'Activity Name', id: '' },
  { label: 'Start Date', id: '' },
  { label: 'End Date', id: '' },
  { label: 'Exclude Package Details', id: '' },
  { label: 'PicOS', id: '' },

  { label: 'Activity Type', id: '' },
  { label: 'Sell Enablers', id: '' },
  { label: '% Of Stores', id: '' },
  { label: 'Price Type', id: '' },
  { label: 'Market Street Challenge', id: '' },
  { label: 'Late-break', id: '' },
];

const activityDetailsFields = [
  { label: 'Pricing', value: 'Inteygrate_com_Streaming_API_Demo' },
  { label: 'Channel', value: '602339850' },
  { label: 'POI', value: '' },
  { label: 'Execution Details', value: '' },
];


const SalesforceRecordView = () => {
  const [record, setRecord] = useState({})

  const leftActivityFields = activityTypeFields.slice(0, 5);
  const rightActivityFields = activityTypeFields.slice(5);

  const handleChange = (e) => {
    const {name, value} = e.target
    const _record = {...record}
    _record[name] = value
    setRecord(_record)
  }

  const renderFieldGroup = (fields) => (
    fields.map(({ label, id }) => (
      <Box
        key={label}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 1,
          // minHeight: 56, // ensures equal row height
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, textAlign: 'left' }}>
          {label}
        </Typography>
        <TextField
          name={label}
          onChange={handleChange}
          variant='standard'
          value={record[label]}
        />
      </Box>
    ))
  );

  return (
    <Paper elevation={1} sx={{ p: 4, width: '90%', mx: 'auto', mt: 6 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2}}>
        Activity Types and Dates
      </Typography>
      <Grid container spacing={1} sx={{width: '100%', marginBottom: 4}}>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{flexBasis: '48%'}}>
          {renderFieldGroup(leftActivityFields)}
        </Grid>
        <Grid item xs={6} md={6} sx={{flexBasis: '48%'}}>
          {renderFieldGroup(rightActivityFields)}
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} gutterBottom sx={{textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2}}>
        Activity Details
      </Typography>
            <Grid container spacing={1} sx={{width: '100%', marginBottom: 4}}>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{flexBasis: '48%'}}>
          {renderFieldGroup(activityDetailsFields)}
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
