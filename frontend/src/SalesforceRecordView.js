import Reac, { useState, useCallback, useEffect } from 'react';
import { IconButton, Stack, Box, Grid, Typography, Divider, Button, Paper, TextField } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LoadingOverlay from './LoadingOverlay'

const SalesforceRecordView = () => {
  const [record, setRecord] = useState({})
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageFiles, setImageFiles] = useState([])


  const setExecutionDetails = (input) => {
    const _record = { ...record }
    _record['Execution Details'] = input
    setRecord(_record)
  }

  const reset = () => {
    setRecord({})
    setImageFiles([])
  }

  const onMagicWand = async () => {
    setLoading(true)
    try {
      const images = imageFiles.map(f => f.split('base64,')[1])
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
          if (event.startsWith("data:")) {
            const json = JSON.parse(event.replace(/^data: /, ""));
            if (json?.data) {
              setExecutionDetails(json?.data?.replace(/^"|"$/g, ''))
              console.log('event result:', json.data)
            }
            if (json?.message) {
              console.log('Got message:', json.message)
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
    { label: 'Id' },
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
    { label: 'Promo Type', multiline: false },
    { label: 'Pricing', multiline: false },
    { label: 'EDV', multiline: false },
    { label: 'Channel', multiline: false },
    { label: 'POI', multiline: false },
    {
      label: 'Execution Details', multiline: true, icon: <IconButton onClick={onMagicWand} sx={{ p: 0 }}>
        <AutoFixHighIcon fontSize="small" color="primary" />
      </IconButton>
    },
  ];

  const rightActivityDetailsFields = [
    { label: 'Purchase Quantity', multiline: false },
    { label: 'Get Quantity', multiline: false },
    { label: 'Save', multiline: false },
    { label: 'Promo Offer', multiline: false },
    { label: 'Package Detail', multiline: false },
    { label: 'Promotion Summary', multiline: true },
  ];

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);  // reader.result is the data-URL
      reader.onerror = reject;
      reader.readAsDataURL(file);                     // <-- magic line
    });
  }

  function fileToUtf8(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error(reader.error?.message ?? 'Failed to read file'));
      reader.readAsText(file, 'utf-8');      // ← key line
    });
  }

  function mapSalesforceRecord(record) {
  return {
    "Activity Name": record.Activity_Name__c + '',
    "Id": record.Id + '',
    "Activity Type": record.Activity_type__c + '',
    Pricing: record.Pricing__c + '',
    "Start Date": record.Start_Date__c + '',
    "End Date": record.End_Date__c + '',
    "Get Quantity": record.Get_Quantity__c + '',
    "Promo Offer": record.Promo_Offer__c + '',
    EDV: record.EDV__c + '',
    Channel: record.Channel_Picklist__c + '',
    POI: record.POI_Picklist__c + '',
    Save: record.Save_Quantity__c + '',
    "Price Type": record.Price_Type__c + '',
    "Purchase Quantity": record.Purchase_Quantity__c + '',
    "Market Street Challenge": record.Market_Street_Challenge__c ? 'Yes' : 'No',
    "Late-break": record.Late_break__c  ? 'Yes' : 'No',
    "Exclude Package Details": "Yes",
    "Promo Type": record.Promo_Type__c + '',
    "% Of Stores": record.Of_Stores__c + '',
    "Package Detail": record.Package_Detail__c + '',
    "Promotion Summary": record.Packaging_Comments__c,
    "Execution Details": record.Product_Price_Execution_Direction__c || ''
  };
}

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging();
    const droppedFiles = e.dataTransfer.imageFiles?.length ? e.dataTransfer.imageFiles : e.dataTransfer.files;
    if (droppedFiles?.length) {
      if (e.target.id === 'filedrop') {
        const _imageFiles = [...imageFiles]
        for(const imgfile of droppedFiles) {
          const encoded = await fileToDataURL(imgfile)
          _imageFiles.push(encoded)
        }
        setImageFiles(_imageFiles)
      }

      if (e.target.id === 'datadrop') {
        const _jsonFile = await fileToUtf8(droppedFiles[0])
        const parsed = JSON.parse(_jsonFile)
        setRecord(mapSalesforceRecord(parsed))
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(e.target.id);
  };
  const handleDragLeave = () => {
    setIsDragging();
  };

  useEffect(() => {
    console.log('record', record)
  }, [record])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    const _record = { ...record }
    _record[name] = value
    setRecord(_record)
  }, [record])

  const renderFieldGroup = useCallback((fields) => (
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
          value={label === 'Execution Details' ? '' : record[label] || ''}
          multiline={multiline}
          // dangerouslySetInnerHTML={{__html: record[label] || ''}}
        />
        {label === 'Execution Details' && <div dangerouslySetInnerHTML={{__html: record[label] || ''}}></div>}
      </Box>
    ))
  ), [record, handleChange]);

  return (
    <Paper elevation={1} sx={{ p: 2, width: '90%', mx: 'auto', mt: 2, marginBottom: '200px' }}>
      <LoadingOverlay open={loading} />
      <Typography id='datadrop' variant="h6" fontWeight={600} gutterBottom
        sx={{ textAlign: 'left', backgroundColor: 'rgb(0,0,0,0.1)', paddingLeft: 2, border: isDragging === 'datadrop' ? '2px dashed blue' : undefined }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
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
          id='filedrop'
          sx={{ flexBasis: '32%', minHeight: '300px', border: isDragging === 'filedrop' ? '2px dashed blue' : undefined }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Stack direction='column'>
            <Typography variant="body2" fontWeight={600} gutterBottom sx={{ textAlign: 'left' }}>
              Execute Images
            </Typography>
            {imageFiles.map(file => {
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
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '32%' }}>
          {renderFieldGroup(leftActivityDetailsFields)}
        </Grid>
        <Grid item xs={8} sm={8} md={8} lg={8} xl={8} sx={{ flexBasis: '32%' }}>
          {renderFieldGroup(rightActivityDetailsFields)}
        </Grid>
      </Grid>
      {/* <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button variant="contained" color="primary">
          Edit
        </Button>
      </Box> */}
      <Button onClick={() => setRecord({})}>Clear</Button>
    </Paper>
  );
};

export default SalesforceRecordView;
