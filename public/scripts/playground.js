let engine = null;

const logger = new ConsoleLogger();

function main()
{
  initUI();
  
  engine = createEngine({logger: logger});
  
  if(!engine)
  {
    throw new Error(`Can not create Engine instance`);
  }
  
  parseRule();
}

function viewJSON(json, targetElement)
{
  $(targetElement).jsonViewer(json);
}

function setRuleStatus(isValid)
{
  if(isValid)
  {
    $('#rule-status').removeClass('badge-danger')
                     .addClass('badge-success')
                     .html('Valid Rule');
  }
  else
  {
    $('#rule-status').removeClass('badge-success')
                     .addClass('badge-danger')
                     .html('Invalid Rule');
  }
}

function setMatchResult(isMatched)
{
  if(isMatched === null)
  {
    $('#match-result').removeClass('alert-danger').removeClass('alert-success')
    .addClass('alert-warning')
    .html('Scanning JSON');
    return;
  }
  
  $('#match-result').removeClass('alert-warning');
  
  if(isMatched)
  {
    $('#match-result').removeClass('alert-danger')
    .addClass('alert-success')
    .html('Scan result: DETECTED');
  }
  else
  {
    $('#match-result').removeClass('alert-success')
    .addClass('alert-danger')
    .html('Scan result: NO MATCH');
  }
}

function parseRule()
{
  // Clear for now
  viewJSON(null, '#rule-parsed');
  setRuleStatus(false);
  
  const ruleContent = $('#rule-yaml').val();
  
  const rule = engine.load(ruleContent);
  
  if(!rule)
  {
    logger.error(`Rule parsing failed`);
    return null;
  }
  
  const conditions = engine.parse(rule);
  
  if(!conditions || conditions.length === 0)
  {
    logger.error(`Condition array is empty`);
    return null;
  }
  
  viewJSON(conditions, '#rule-parsed');
  
  setRuleStatus(true);
  
  const matched = engine.scan(rule, caseJSON);
  
  setMatchResult(matched);
  
  logger.info(`Rule parsing succeeded`);
  
  return matched;
}

function loadTemplateRule(name)
{
  const ruleContent = $(`#template-rules > #${name}`).html().trim();
  
  $('#rule-yaml').val(ruleContent);
}

function addTabSupport()
{
  $("textarea").keydown(function(e)
  {
    if(e.keyCode === 9)
    {
      e.preventDefault();
      for(let i=0; i<2; i++)
      {
        const start = this.selectionStart,
          end = this.selectionEnd,
          value = $(this).val();
    
        $(this).val(value.substring(0, start)
          + " "
          + value.substring(end));
        
        this.selectionStart = this.selectionEnd = start + 1;
      }
      
      return false;
    }
  });
}

function initUI()
{
  $('.dropdown-toggle').dropdown();
  
  $('#btn-scan-rule').click(function()
  {
    $(this).html('Scanning Rule...').prop('disabled', true);
    setMatchResult(null);
    
    setTimeout(() =>
    {
      try
      {
        parseRule();
      }
      finally
      {
        $(this).html('Scan Rule').prop('disabled', false);
      }
    }, 500);
  });
  
  $('#rule-status').html('Valid Rule');
  
  $('.dropdown-menu a').click(function()
  {
    const ruleName = $(this).data('rule');
  
    loadTemplateRule(ruleName);
    
    $('#examples').text($(this).text());
    
    parseRule();
  });
  
  loadTemplateRule('minimal');
  
  addTabSupport();
}

$(document).ready(main);
