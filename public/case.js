const json = {
  Processes: [
    {
      Name: 'csrss.exe',
      CommandLine: 'csrss.exe SharedSection=1024,20480',
      Modules: [
        {
          DllPath: 'smss.dll'
        }
      ]
    },
    {
      Name: 'smss.exe',
      CommandLine: 'C:\\ProgramFiles\\smss.exe',
      Modules: [
        {
          DllPath: 'smss.dll'
        }
      ]
    }
  ],
  Prefetch: [
    {
      Name: 'Mimikatz.exe',
    },
    {
      Name: 'Eraser.exe',
    }
  ],
  Event: [
    { ID: 4624 },
    { ID: 1900 }
  ]
};
