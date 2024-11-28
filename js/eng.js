function getBom(stp,nstp,filter,template,output)
{
    return {
        type: "ExecuteFunction",
        name: stp+"Step",
        next: nstp+"Step",
        addonName: "viewer",
        functionName: "generateBom",
        arguments: [
            {
                filterId: filter,
                templateId: template
            }
        ],
        output: ".bom"+output
    };
}