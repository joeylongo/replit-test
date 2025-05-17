import Reac, { useState } from 'react';
import { IconButton, Stack, Box, Grid, Typography, Divider, Button, Paper, TextField } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LoadingOverlay from './LoadingOverlay'

const SalesforceRecordView = () => {
  const [record, setRecord] = useState({})
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])

  const setExecutionDetails = (input) => {
    const _record = { ...record }
    _record['Execution Details'] = input
    setRecord(_record)
  }

  const reset = () => {
    setFiles([])
  }

  const onMagicWand = async () => {
    setLoading(true)
    try {
      const images = files.map(f => f.split('base64,')[1])
      const res = await fetch("http://localhost:3002/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record, images }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        const events = partial.split("\n\n");
        partial = events.pop() || "";

        for (const event of events) {
          console.log('got an event', event)
          if (event.startsWith("data:")) {
            const json = JSON.parse(event.replace(/^data: /, ""));
            console.log('json', json)
            if (json?.data) {
              setExecutionDetails(json?.data?.replace(/^"|"$/g, ''))
              reset()
              console.log('event result:', json.data)
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false);
    }
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
      label: 'Execution Details', multiline: true, icon: <IconButton onClick={onMagicWand} sx={{ p: 0 }}>
        <AutoFixHighIcon fontSize="small" color="primary" />
      </IconButton>
    },
  ];

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);  // reader.result is the data-URL
      reader.onerror = reject;
      reader.readAsDataURL(file);                     // <-- magic line
    });
  }


  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const _files = [...files]
      const encoded = await fileToDataURL(droppedFile)
      _files.push(encoded)
      setFiles(_files)
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };

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
        <Stack direction='row' sx={{ alignItems: 'center' }}>
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
      <LoadingOverlay open={loading} />
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2 }}>
        Activity Types and Dates
      </Typography>
      <Grid container spacing={1} sx={{ width: '100%', marginBottom: 4 }}>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '32%' }}>
          {renderFieldGroup(leftActivityFields)}
        </Grid>
        <Grid item xs={6} md={6} sx={{ flexBasis: '32%' }}>
          {renderFieldGroup(rightActivityFields)}
        </Grid>
        <Grid item xs={6} md={6}
          sx={{ flexBasis: '32%', minHeight: '300px', border: isDragging ? '2px dashed blue' : undefined }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Stack direction='column'>
            <Typography variant="body2" fontWeight={600} gutterBottom sx={{ textAlign: 'left' }}>
              Execute Images
            </Typography>
            {files.map(file => {
              return <Box
                component="img"
                src={file}
                alt="Link preview"
                sx={{
                  maxWidth: 200,
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              />
            })}
          </Stack>
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
